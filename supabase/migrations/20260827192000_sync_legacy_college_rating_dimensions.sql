begin;

create or replace function public.sync_college_rating_dimensions()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.food_score := coalesce(new.food_score, new.food);
    new.food := coalesce(new.food, new.food_score);
    new.hall_score := coalesce(new.hall_score, new.venue);
    new.venue := coalesce(new.venue, new.hall_score);
    new.atmosphere_score := coalesce(new.atmosphere_score, new.atmosphere);
    new.atmosphere := coalesce(new.atmosphere, new.atmosphere_score);
    new.hospitality_score := coalesce(new.hospitality_score, new.friendliness);
    new.friendliness := coalesce(new.friendliness, new.hospitality_score);
    new.value_score := coalesce(new.value_score, new.value);
    new.value := coalesce(new.value, new.value_score);
  else
    if new.food_score is distinct from old.food_score then new.food := new.food_score;
    elsif new.food is distinct from old.food then new.food_score := new.food;
    end if;
    if new.hall_score is distinct from old.hall_score then new.venue := new.hall_score;
    elsif new.venue is distinct from old.venue then new.hall_score := new.venue;
    end if;
    if new.atmosphere_score is distinct from old.atmosphere_score then new.atmosphere := new.atmosphere_score;
    elsif new.atmosphere is distinct from old.atmosphere then new.atmosphere_score := new.atmosphere;
    end if;
    if new.hospitality_score is distinct from old.hospitality_score then new.friendliness := new.hospitality_score;
    elsif new.friendliness is distinct from old.friendliness then new.hospitality_score := new.friendliness;
    end if;
    if new.value_score is distinct from old.value_score then new.value := new.value_score;
    elsif new.value is distinct from old.value then new.value_score := new.value;
    end if;
  end if;

  new.score := coalesce(
    new.score,
    round((new.food_score + new.hall_score + new.atmosphere_score + new.hospitality_score + new.value_score)::numeric / 5)::integer
  );
  return new;
end;
$$;

drop trigger if exists sync_college_rating_dimensions on public.college_ratings;
create trigger sync_college_rating_dimensions
before insert or update on public.college_ratings
for each row execute function public.sync_college_rating_dimensions();

comment on function public.sync_college_rating_dimensions() is
  'Keeps the original rating columns and the restored five-dimensional review columns compatible in both directions.';

notify pgrst, 'reload schema';

commit;
